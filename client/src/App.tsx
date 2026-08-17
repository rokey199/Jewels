import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SettingsProvider } from './context/SettingsContext'
import { WishlistProvider } from './context/WishlistContext'
import { ShowroomProvider } from './showroom/ShowroomProvider'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ToastStack } from './components/Toast'
import { ScrollToTop } from './components/ScrollToTop'
import Home from './pages/Home'
import Products from './pages/Products'
import CategoryPage from './pages/Category'
import ProductDetail from './pages/ProductDetail'
import Search from './pages/Search'
import Chat from './pages/Chat'
import OrderDetail from './pages/OrderDetail'
import Account from './pages/Account'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <WishlistProvider>
            <ShowroomProvider>
              <ScrollToTop />
              <Header />
              <main id="main">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/order/:id" element={<OrderDetail />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <ToastStack />
            </ShowroomProvider>
          </WishlistProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  )
}
