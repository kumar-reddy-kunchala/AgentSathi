// User Registration: /user/register
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ArrowLeft, User, Phone, MapPin, Mail, Award, CreditCard, FileText } from 'lucide-react';

export const UserRegisterView: React.FC = () => {
  const { navigate, loginAsUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [bio, setBio] = useState('');
  const [qualification, setQualification] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.register({
        name,
        email,
        phone,
        role: 'USER',
        additionalData: {
          address,
          pinCode,
          bio,
          qualification,
          aadhaarNumber,
          panNumber,
        },
      });
      await loginAsUser(email);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ServiceAgent
        </button>

        <h2 className="text-center text-2xl font-extrabold text-stone-900 tracking-tight">
          Create User Account
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Complete your personal details to get assistance coordinated by Sathi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 sm:rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleRegister}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Kumar Reddy"
                  className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="kumar@example.com"
                    className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 98765 00000"
                    className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Qualification
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Award className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. B.Tech / Higher Secondary"
                  className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Bio / Personal Profile
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute top-2.5 left-3 pointer-events-none text-stone-400">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary or special care requirements..."
                  className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Address
                </label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Indiranagar, Bengaluru"
                    className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="560038"
                  className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Identity Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Aadhaar Number
                  </label>
                  <div className="mt-1 relative">
                    <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="12-digit Aadhaar"
                      maxLength={14}
                      className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-teal-600 focus:border-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    PAN Number
                  </label>
                  <div className="mt-1 relative">
                    <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="10-digit PAN"
                      maxLength={10}
                      className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm uppercase focus:ring-teal-600 focus:border-teal-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-100 pt-5 text-center text-xs text-stone-500">
            <span>Already have an account? </span>
            <button
              onClick={() => navigate('/user/login')}
              className="font-bold text-teal-700 hover:underline cursor-pointer"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
