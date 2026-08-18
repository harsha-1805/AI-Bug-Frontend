import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Avatar from "../components/Avatar.jsx";
import Badge from "../components/Badge.jsx";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { getErrorMessage } from "../utils/apiError.js";
import {
  isEmailDomainAllowed,
  ALLOWED_EMAIL_DOMAINS,
  isEmailLocalPartValid,
  EMAIL_LOCAL_PART_ERROR,
} from "../utils/emailValidation.js";

// Password complexity rule:
// at least one uppercase letter,
// one lowercase letter,
// one number,
// one special character.
const PASSWORD_COMPLEXITY_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

// Basic email format validation.
const EMAIL_FORMAT_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export default function Settings() {
  const { user, getCurrentUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
  });

  const [savingProfile, setSavingProfile] = useState(false);

  const [emailError, setEmailError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingPassword, setSavingPassword] = useState(false);

  const roleNames = user?.roles?.length
    ? user.roles.map((r) => r.name)
    : user?.role?.name
      ? [user.role.name]
      : [];

  /**
   * Validate email completely.
   */
  const validateEmail = (value) => {
    const email = value.trim();

    // Required
    if (!email) {
      return "Email address is required";
    }

    // Maximum length
    if (email.length > 254) {
      return "Email address is too long";
    }

    // Must contain @
    if (!email.includes("@")) {
      return "Email address must contain @";
    }

    // Only one @ is allowed
    const atCount = (email.match(/@/g) || []).length;

    if (atCount !== 1) {
      return "Enter a valid email address";
    }

    const [localPart, domain] = email.split("@");

    // Local part is required
    if (!localPart) {
      return "Email address must have a name before @";
    }

    // Domain is required
    if (!domain) {
      return "Email address must have a domain";
    }

    // Local part cannot start with a dot
    if (localPart.startsWith(".")) {
      return "Email address cannot start with a dot";
    }

    // Local part cannot end with a dot
    if (localPart.endsWith(".")) {
      return "Email address cannot end with a dot";
    }

    // Consecutive dots are invalid
    if (localPart.includes("..")) {
      return "Email address cannot contain consecutive dots";
    }

    // Validate the local part using your existing validation utility
    if (!isEmailLocalPartValid(email)) {
      return EMAIL_LOCAL_PART_ERROR;
    }

    // Domain cannot start or end with a hyphen
    if (domain.startsWith("-") || domain.endsWith("-")) {
      return "Enter a valid email domain";
    }

    // Domain must contain a dot
    if (!domain.includes(".")) {
      return "Email domain must contain a valid extension";
    }

    // Domain cannot contain consecutive dots
    if (domain.includes("..")) {
      return "Enter a valid email domain";
    }

    // Validate complete email format
    if (!EMAIL_FORMAT_RE.test(email)) {
      return "Enter a valid email address";
    }

    // Validate against allowed domains
    if (!isEmailDomainAllowed(email)) {
      return `Please use a standard email domain (${ALLOWED_EMAIL_DOMAINS
        .map((d) => `@${d}`)
        .join(", ")}).`;
    }

    return "";
  };

  /**
   * Save profile.
   */
  const handleProfileSave = async (e) => {
    e.preventDefault();

    const fullName = profileForm.fullName.trim();
    const email = profileForm.email.trim();

    // Full name validation
    if (!fullName) {
      toast.error("Full name can't be empty");
      return;
    }

    // Complete email validation
    const validationError = validateEmail(email);

    if (validationError) {
      setEmailError(validationError);
      toast.error(validationError);
      return;
    }

    setEmailError("");
    setSavingProfile(true);

    try {
      await authService.updateProfile({
        fullName,
        email,
      });

      // Refresh AuthContext so sidebar/avatar also updates
      await getCurrentUser();

      setEmailError("");
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  /**
   * Change password.
   */
  const handlePasswordSave = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error("Enter your current password");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (!PASSWORD_COMPLEXITY_RE.test(passwordForm.newPassword)) {
      toast.error(
        "New password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error(
        "New password must be different from your current password"
      );
      return;
    }

    setSavingPassword(true);

    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Password changed successfully");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change password"));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile and password"
      />

      <div className="grid max-w-3xl gap-6">
        {/* Profile card */}
        <div className="card p-6">
          <div className="mb-6 flex items-center gap-4">
            <Avatar
              name={user?.full_name || "User"}
              size={56}
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                {user?.full_name || "—"}
              </p>

              <p className="text-xs text-slate-400">
                {user?.email || "—"}
              </p>

              {roleNames.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {roleNames.map((name) => (
                    <Badge key={name} tone="info">
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={handleProfileSave}
          >
            {/* Full name */}
            <Input
              label="Full name"
              value={profileForm.fullName}
              onChange={(e) =>
                setProfileForm((f) => ({
                  ...f,
                  fullName: e.target.value,
                }))
              }
            />

            {/* Email */}
            <Input
              label={
                <span>
                  Email address{" "}
                  <span className="text-red-500">*</span>
                </span>
              }
              type="email"
              required
              value={profileForm.email}
              error={emailError}
              onBlur={() => {
                const error = validateEmail(profileForm.email);
                setEmailError(error);
              }}
              onChange={(e) => {
                const value = e.target.value;

                setProfileForm((f) => ({
                  ...f,
                  email: value,
                }));

                // If an error is already visible,
                // validate again while the user types.
                if (emailError) {
                  setEmailError(validateEmail(value));
                }
              }}
            />

            <div className="sm:col-span-2">
              <Button
                type="submit"
                loading={savingProfile}
              >
                Save profile
              </Button>
            </div>
          </form>
        </div>

        {/* Change password card */}
        <div className="card p-6">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">
            Change password
          </h3>

          <p className="mb-4 text-xs text-slate-400">
            You'll need your current password to set a new one.
          </p>

          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={handlePasswordSave}
          >
            {/* Current password */}
            <div className="sm:col-span-2">
              <Input
                label="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>

            {/* New password */}
            <Input
              label="New password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  newPassword: e.target.value,
                }))
              }
              placeholder="8+ chars, upper, lower, number & symbol"
            />

            {/* Confirm password */}
            <Input
              label="Confirm new password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  confirmPassword: e.target.value,
                }))
              }
            />

            <div className="sm:col-span-2">
              <Button
                type="submit"
                loading={savingPassword}
              >
                Update password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}