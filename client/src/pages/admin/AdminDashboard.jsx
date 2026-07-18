import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <section>
      <h1>Admin Dashboard</h1>
      <div className="admin-links">
        <Link to="/admin/products">Manage Products</Link>
      </div>
    </section>
  );
}
