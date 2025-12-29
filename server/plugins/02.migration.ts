import { migrate } from '../database/migrate'

export default defineNitroPlugin(async () => {
  console.log('Running migrations')
  await migrate()
})
