import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import type { ShallowRef, WatchOptions, WatchSource } from 'vue'
import {
  STORAGE_REFRESH_KEY,
  subscribeStorageRefresh,
} from '~/shared/storage/refresh'

type Value<T, I> = I extends undefined ? T | undefined : T | I

type UseIDBWithDepsOptions<I, Immediate> = {
  onError?: (error: unknown) => void
  initialValue?: I
} & WatchOptions<Immediate>

type UseIDBOptions<I> = {
  onError?: (error: unknown) => void
  initialValue?: I
}

function tryOnScopeDispose(fn: () => void) {
  if (getCurrentScope()) onScopeDispose(fn)
}

export function useIDBWithDeps<
  T,
  D,
  I = undefined,
  Immediate extends Readonly<boolean> = true,
>(
  deps: WatchSource<D> | WatchSource<D>[],
  querier: (data: D) => T | Promise<T>,
  options: UseIDBWithDepsOptions<I, Immediate> = {},
): ShallowRef<Value<T, I>> {
  const { onError, initialValue, ...rest } = options

  const value = shallowRef<T | I | undefined>(initialValue)
  const refreshToken = useIDBKeyval<number>(STORAGE_REFRESH_KEY, 0, {
    writeDefaults: true,
  })
  let hasValue = false
  let lastData = undefined as D | undefined

  async function runQuery() {
    if (!hasValue || lastData === undefined) return

    try {
      value.value = await querier(lastData)
    } catch (error) {
      onError?.(error)
    }
  }

  watch(
    deps,
    (data) => {
      hasValue = true
      lastData = data as D
      void runQuery()
    },
    { immediate: true, ...rest },
  )
  watch(refreshToken.data, () => {
    void runQuery()
  })

  const stopRefreshSubscription = subscribeStorageRefresh((value) => {
    void refreshToken.set(value)
  })

  tryOnScopeDispose(() => {
    stopRefreshSubscription()
  })

  return value as ShallowRef<Value<T, I>>
}

export function useIDB<T, I = undefined>(
  querier: () => T | Promise<T>,
  options: UseIDBOptions<I> = {},
): ShallowRef<Value<T, I>> {
  const { onError, initialValue } = options

  const value = shallowRef<T | I | undefined>(initialValue)
  const refreshToken = useIDBKeyval<number>(STORAGE_REFRESH_KEY, 0, {
    writeDefaults: true,
  })

  async function start() {
    try {
      value.value = await querier()
    } catch (error) {
      onError?.(error)
    }
  }

  watch(refreshToken.data, () => {
    void start()
  })

  const stopRefreshSubscription = subscribeStorageRefresh((value) => {
    void refreshToken.set(value)
  })

  void start()

  tryOnScopeDispose(() => {
    stopRefreshSubscription()
  })

  return value as ShallowRef<Value<T, I>>
}
