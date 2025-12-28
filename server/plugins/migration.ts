import { migrate } from '../database/migrate'

export default defineNitroPlugin(async () => {
  console.log('Run migrations')
  await migrate()
})
