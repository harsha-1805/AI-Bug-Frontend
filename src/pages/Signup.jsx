import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../layouts/AuthLayout.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/apiError.js";
import { isEmailDomainAllowed, ALLOWED_EMAIL_DOMAINS } from "../utils/emailValidation.js";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (values) => {
    try {
      await signup(values);
      navigate("/login", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, "Could not create your account");
      toast.error(message);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start managing bugs smarter with BugPilot AI">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Doe"
          maxLength={100}
          showCounter={false}
          error={errors.fullName?.message}
          {...register("fullName", {
            required: "Full name is required",
            maxLength: { value: 100, message: "Full name must be 100 characters or fewer" },
          })}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="you@gmail.com"
          maxLength={254}
          showCounter={false}
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            maxLength: { value: 254, message: "Email is too long" },
            validate: (value) =>
              isEmailDomainAllowed(value) ||
              `Please use a standard email domain (${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")})`,
          })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          maxLength={72}
          showCounter={false}
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Password must be at least 8 characters" },
            maxLength: { value: 72, message: "Password must be 72 characters or fewer" },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          maxLength={72}
          showCounter={false}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === password || "Passwords do not match",
          })}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
