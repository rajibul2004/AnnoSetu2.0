"use client";
 
import React, { useState, ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  FaEnvelope,
  FaLock,
  FaGoogle,
  FaFacebook,
  FaLeaf,
  FaArrowRight,
} from "react-icons/fa";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import toast from "react-hot-toast";
 
interface LoginFormData {
  email: string;
  password: string;
}
 
interface LoginFormErrors {
  email?: string;
  password?: string;
}
 
const Login = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
 
  const validateForm = (): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.email || !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Valid email is required";
    return newErrors;
  };
 
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();
 
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form!");
      return;
    }
 
    setLoading(true);
    try {
      // redirect: false lets us handle the error/success ourselves instead
      // of a hard page navigation, so we can show a toast either way.
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
 
      if (!result || result.error) {
        // NextAuth intentionally returns a generic "CredentialsSignin"
        // error for any failed login (wrong email or wrong password) —
        // this is deliberate so the API doesn't reveal which one was wrong.
        toast.error("Invalid email or password");
        return;
      }
 
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
 
  return (
    <div className="min-h-screen  flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl logotext font-bold"
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm dark:text-gray-300 text-gray-600"
          >
            Sign in to continue your food-saving journey
          </motion.p>
        </div>
 
        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card backdrop-blur-lg py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 "
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
                error={errors.email}
                value={formData.email}
                onChange={handleChange}
                icon={<FaEnvelope className="text-gray-400" />}
                placeholder="Enter your email"
              />
            </div>
 
            {/* Password Field */}
            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                error={errors.password}
                value={formData.password}
                onChange={handleChange}
                icon={<FaLock className="text-gray-400" />}
                placeholder="Enter your password"
              />
            </div>
 
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center  group cursor-pointer">
                <input type="checkbox" className="w-4 h-4 cursor-pointer " />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200">
                  Remember me
                </span>
              </label>
 
              <Link
                href="/auth/forget-password"
                className="group text-sm font-medium text-green-600 hover:text-green-700 transition-colors duration-200 flex items-center gap-1"
              >
                Forgot password?
                <FaArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            </div>
 
            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Sign In
            </Button>
          </form>
 
          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-600 dark:text-gray-300">
                  Or continue with
                </span>
              </div>
            </div>
 
            <div className="mt-6 grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/24 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 group cursor-pointer"
              >
                <FaGoogle className="mr-2 text-red-500 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium">Google</span>
              </motion.button>
 
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toast("Facebook login coming soon!")}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/24 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 group cursor-pointer"
              >
                <FaFacebook className="mr-2 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium">Facebook</span>
              </motion.button>
            </div>
          </div>
 
          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              New to Annosetu?{" "}
              <Link
                href="/register"
                className="font-medium text-green-600 hover:text-green-700 transition-colors duration-200 inline-flex items-center gap-1 group"
              >
                Create an account
                <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </p>
          </div>
 
          {/* Impact Message */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FaLeaf className="text-green-500" />
              <span>Join 5,000+ users saving food daily</span>
              <FaLeaf className="text-amber-500" />
            </div>
          </div>
        </motion.div>
 
        {/* Footer Links */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          <Link
            href="/public/privacy"
            className="hover:text-gray-600 dark:hover:text-gray-300 mx-2 transition-colors duration-200"
          >
            Privacy
          </Link>
          •
          <Link
            href="/public/terms"
            className="hover:text-gray-600 dark:hover:text-gray-300 mx-2 transition-colors duration-200"
          >
            Terms
          </Link>
          •
          <Link
            href="/public/contact"
            className="hover:text-gray-600 dark:hover:text-gray-300 mx-2 transition-colors duration-200"
          >
            Contact
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
 
export default Login;
 