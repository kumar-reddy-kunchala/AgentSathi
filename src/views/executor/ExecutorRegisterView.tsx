// Executor Registration: /executor/register
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ArrowLeft, Briefcase, Phone, Mail, User, ShieldCheck, MapPin, Award, CreditCard, Landmark, FileText } from 'lucide-react';
import { ServiceType } from '../../types';

export const ExecutorRegisterView: React.FC = () => {
  const { navigate, loginAsExecutor } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [bio, setBio] = useState('');
  const [qualification, setQualification] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [availabilityMode, setAvailabilityMode] = useState<'ALWAYS_AVAILABLE' | 'SCHEDULED_HOURS' | 'UNAVAILABLE'>('ALWAYS_AVAILABLE');
  
  // Bank details state
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const [selectedCapabilities, setSelectedCapabilities] = useState<ServiceType[]>(['MEDICINE_PICKUP']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCapability = (cap: ServiceType) => {
    if (selectedCapabilities.includes(cap)) {
      setSelectedCapabilities(selectedCapabilities.filter((c) => c !== cap));
    } else {
      setSelectedCapabilities([...selectedCapabilities, cap]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCapabilities.length === 0) {
      setError('Please select at least one service capability');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.register({
        name,
        email,
        phone,
        role: 'EXECUTOR',
        additionalData: {
          address,
          pinCode,
          bio,
          qualification,
          aadhaarNumber,
          panNumber,
          availabilityMode,
          capabilities: selectedCapabilities,
          bankDetails: {
            accountName: accountName || name,
            accountNumber,
            bankName,
            ifscCode,
            upiId,
          },
        },
      });
      await loginAsExecutor(email);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ServiceAgent
        </button>

        <h2 className="text-center text-2xl font-extrabold text-stone-900 tracking-tight">
          Register as Service Provider
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Join our verified network. Fill in your bio, identity, availability and bank details.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
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
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Suresh Kumar"
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="suresh.k@example.com"
                  className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+91 98111 00000"
                  className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Qualification
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. Graduate / Certified Caregiver"
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Bio / Experience
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of skills, experience or caregiver background..."
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Service Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Street / Area / City"
                  className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                />
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
                  className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Availability Mode
              </label>
              <select
                value={availabilityMode}
                onChange={(e) => setAvailabilityMode(e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
              >
                <option value="ALWAYS_AVAILABLE">Always Available (24/7)</option>
                <option value="SCHEDULED_HOURS">Scheduled Hours Only</option>
                <option value="UNAVAILABLE">Unavailable Currently</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Service Capabilities
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['MEDICINE_PICKUP', 'GROCERY_ASSISTANCE', 'TRANSPORTATION', 'COMPANION'] as ServiceType[]).map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCapability(cap)}
                    className={`p-2 rounded-lg border text-left font-medium transition cursor-pointer ${
                      selectedCapabilities.includes(cap)
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {cap.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* KYC Identity */}
            <div className="pt-2 border-t border-stone-100">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Identity & KYC
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="12-digit Aadhaar"
                    maxLength={14}
                    className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="10-digit PAN"
                    maxLength={10}
                    className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm uppercase focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="pt-2 border-t border-stone-100">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Bank & Payout Account
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. SBI / HDFC"
                    className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                    className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm uppercase focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="mobile@upi"
                    className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-indigo-700 hover:bg-indigo-800 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Registering...' : 'Complete Provider Registration'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-stone-100 pt-5 text-center text-xs text-stone-500">
            <span>Already registered? </span>
            <button
              onClick={() => navigate('/executor/login')}
              className="font-bold text-amber-700 hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
