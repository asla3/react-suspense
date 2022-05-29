// Suspense Image
// http://localhost:3000/isolated/exercise/05.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
  PokemonErrorBoundary,
  getImageUrlForPokemon,
} from '../pokemon'
import {createResource} from '../utils'

const preloadImage = src => {
  return new Promise(resolve => {
    const img = document.createElement('img')
    img.src = src
    img.onload = () => resolve(src)
  })
}

const Img = ({src, ...props}) => {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} src={src} />
}

function PokemonInfo({pokemonResource}) {
  const pokemon = pokemonResource.data.read()
  const pokemonSrc = pokemonResource.src.read()
  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <Img src={pokemonSrc} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

const SUSPENSE_CONFIG = {
  timeoutMs: 4000,
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

const pokemonResourceCache = {}

function getPokemonResource(name) {
  const lowerName = name.toLowerCase()
  const resource = {
    data:
      pokemonResourceCache[lowerName]?.data ??
      createPokemonDataResource(lowerName),
    src:
      pokemonResourceCache[lowerName]?.src ??
      createPokemonSrcResource(lowerName),
  }
  pokemonResourceCache[lowerName] = resource

  return resource
}

function createPokemonDataResource(pokemonName) {
  return createResource(fetchPokemon(pokemonName))
}

const createPokemonSrcResource = pokemonName => {
  return createResource(preloadImage(getImageUrlForPokemon(pokemonName)))
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)

  React.useEffect(() => {
    if (!pokemonName) {
      setPokemonResource(null)
      return
    }
    startTransition(() => {
      setPokemonResource(getPokemonResource(pokemonName))
    })
  }, [pokemonName, startTransition])

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className={`pokemon-info ${isPending ? 'pokemon-loading' : ''}`}>
        {pokemonResource ? (
          <PokemonErrorBoundary
            onReset={handleReset}
            resetKeys={[pokemonResource]}
          >
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResource={pokemonResource} />
            </React.Suspense>
          </PokemonErrorBoundary>
        ) : (
          'Submit a pokemon'
        )}
      </div>
    </div>
  )
}

export default App
