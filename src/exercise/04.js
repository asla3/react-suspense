// Cache resources
// http://localhost:3000/isolated/exercise/04.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
  PokemonErrorBoundary,
} from '../pokemon'
import {createResource} from '../utils'

function PokemonInfo({pokemonResource}) {
  const pokemon = pokemonResource.read()
  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
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

// const getPokemonResource = pokemonName => {
//   let resource = pokemonResourceCache[pokemonName]
//   if (!resource) {
//     resource = createPokemonResource(pokemonName)
//     pokemonResourceCache[pokemonName] = resource
//   }
//   return resource
// }

function createPokemonResource(pokemonName) {
  return createResource(fetchPokemon(pokemonName))
}

const PokemonCacheContext = React.createContext(null)

const PokemonCacheProvider = ({cacheTime, ...props}) => {
  const cacheRef = React.useRef({})
  const timeoutsRef = React.useRef({})
  const lastFetchedRef = React.useRef(null)

  React.useEffect(
    () => () =>
      Object.values(timeoutsRef.current).forEach(timeout =>
        clearTimeout(timeout),
      ),
    [],
  )

  const getPokemonResource = React.useCallback(
    pokemonName => {
      if (timeoutsRef.current[pokemonName]) {
        clearTimeout(timeoutsRef.current[pokemonName])
        delete timeoutsRef.current[pokemonName]
      }

      if (
        cacheTime &&
        lastFetchedRef.current &&
        pokemonName !== lastFetchedRef.current
      ) {
        const resourceToBeDeleted = lastFetchedRef.current // need to store it in a variable so it won't change when the timeout is called
        timeoutsRef.current[resourceToBeDeleted] = setTimeout(() => {
          delete cacheRef.current[resourceToBeDeleted]
          delete timeoutsRef.current[resourceToBeDeleted]
        }, cacheTime)
      }
      lastFetchedRef.current = pokemonName
      let resource = cacheRef.current[pokemonName]
      if (!resource) {
        resource = createPokemonResource(pokemonName)
        cacheRef.current[pokemonName] = resource
      }
      return resource
    },
    [cacheTime],
  )

  return <PokemonCacheContext.Provider {...props} value={getPokemonResource} />
}

const usePokemonCache = () => {
  const context = React.useContext(PokemonCacheContext)
  if (!context) {
    throw new Error(
      `usePokemonCache must be used inside a PokemonCacheProvider`,
    )
  }
  return context
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)

  const getPokemonResource = usePokemonCache()

  React.useEffect(() => {
    if (!pokemonName) {
      setPokemonResource(null)
      return
    }
    startTransition(() => {
      setPokemonResource(getPokemonResource(pokemonName))
    })
  }, [pokemonName, startTransition, getPokemonResource])

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

const AppWithProvider = () => {
  return (
    <PokemonCacheProvider cacheTime={5000}>
      <App />
    </PokemonCacheProvider>
  )
}

export default AppWithProvider
