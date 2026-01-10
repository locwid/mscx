export function useHeaderTitle(value: MaybeRefOrGetter<string>) {
  const ref = toRef(value)
  const { headerTitle } = storeToRefs(useAppStore())

  watchImmediate(ref, (v) => headerTitle.value = v)
}
