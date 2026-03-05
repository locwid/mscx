export function useHeaderTitle(value: MaybeRefOrGetter<string>) {
  const ref = toRef(value)
  const appStore = useAppStore()

  watchImmediate(ref, (v) => appStore.setHeaderTitle(v))
}
