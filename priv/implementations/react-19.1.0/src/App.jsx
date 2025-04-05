import { TodoContext } from './TodoContext'
import { Header } from './components/Header'
import { Main } from './components/Main'
import { Footer } from './components/Footer'


function App() {
  return (
    <TodoContext>
      <Header />
      <Main />
      <Footer />
    </TodoContext>
  )
}

export default App
