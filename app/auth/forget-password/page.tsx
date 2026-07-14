"use client";
 
import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaEnvelope,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPaperPlane,
  FaLock,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
// import { useAuth } from "@/hooks/useAuth";

// import { useAuth } from "@/context/AuthContext";
 
// If your AuthContext already exports a typed hook, this import/type
// can be removed. Included here so the file type-checks standalone.
interface AuthContextValue {
  resetPassword: (email: string) => void | Promise<void>;
}
 
const ForgotPassword: React.FC = () => {
//   const { resetPassword } = useAuth() as AuthContextValue;
  const router = useRouter();
 
  const [email, setEmail] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
 
  const validateEmail = (value: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };
 
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
 
    if (!email) {
      setError("Email is required");
      return;
    }
 
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
 
    setLoading(true);
    try {
      // await resetPassword(email);
      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Back to Login Link */}
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 transition-colors mb-4"
        >
          <FaArrowLeft className="mr-2" size={14} />
          Back to Login
        </Link>
 
        {/* Header */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold logotext"
          >
            Forgot Password?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-gray-600 dark:text-gray-300"
          >
            No worries! Enter your email and we&apos;ll send you a reset link.
          </motion.p>
        </div>
 
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card backdrop-blur-lg rounded-2xl shadow-2xl p-8 "
        >
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your registered email"
                  icon={
                    <FaEnvelope className="text-gray-400 dark:text-gray-500" />
                  }
                  error={error}
                  required
                />
              </div>
 
              {/* Info Message */}
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FaLock className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-50">
                      Secure Reset Process
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                      We&apos;ll send a secure link to your email that expires
                      in 1 hour. Click it to reset your password.
                    </p>
                  </div>
                </div>
              </div>
 
              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                className="bg-linear-to-r from-green-500 to-amber-500 hover:from-green-600 hover:to-amber-600"
              >
                <FaPaperPlane className="mr-2" />
                Send Reset Link
              </Button>
 
              {/* Help Text */}
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="w-10 h-10 text-green-600 dark:text-green-300" />
              </div>
 
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                Check Your Email
              </h3>
 
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We&apos;ve sent a password reset link to:
                <br />
                <span className="font-semibold text-green-600 dark:text-green-300">
                  {email}
                </span>
              </p>
 
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-300 mt-0.5" />
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-50">
                      Didn&apos;t receive the email?
                    </h4>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-200 mt-2 space-y-1">
                      <li>• Check your spam or junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• The link expires in 1 hour</li>
                    </ul>
                  </div>
                </div>
              </div>
 
              <div className="space-y-3">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  fullWidth
                >
                  Try Another Email
                </Button>
 
                <Button
                  onClick={() => router.push("/auth/login")}
                  fullWidth
                  className="bg-linear-to-r from-green-500 to-amber-500"
                >
                  Back to Login
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
 
        {/* Security Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-gray-500 dark:text-gray-400"
        >
          For security reasons, reset links expire after 1 hour.
          <br />
          Never share your password or reset links with anyone.
        </motion.p>
      </motion.div>
    </div>
  );
};
 
export default ForgotPassword;