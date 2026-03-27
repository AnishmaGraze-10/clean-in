import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    accessCode: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (form.role === 'admin' && !form.accessCode) {
      toast.error('Access code is required for admin registration');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      };
      if (form.role === 'admin') {
        payload.accessCode = form.accessCode;
      }
      const { data } = await api.post('/auth/register', payload);
      login(data.user, data.token);
      toast.success('Registered successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">REGISTER NOW</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Enter your confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === 'admin' && (
              <div className="flex-1">
                <input
                  type="password"
                  name="accessCode"
                  placeholder="Enter access code"
                  value={form.accessCode}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded bg-emerald-100 px-4 py-2 text-sm font-semibold text-rose-500 hover:bg-emerald-200 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Register Now'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          already have an account?{' '}
          <Link to="/login" className="font-medium text-rose-500 hover:underline">
            login now
          </Link>
        </p>

        {/* Login Type Legend */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-center text-sm font-semibold text-rose-500">Login Type</p>
          <div className="mt-2 flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold">1</span>
              <span className="text-slate-600">- User</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">2</span>
              <span className="text-slate-600">- Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

