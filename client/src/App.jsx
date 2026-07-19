import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import RequireAdmin from './components/RequireAdmin';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductList from './pages/admin/AdminProductList';
import AdminProductForm from './pages/admin/AdminProductForm';

export default function App() {
  return (
    <div>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProductList />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
