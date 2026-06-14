import { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  User,
  Lock,
  Bell,
  Palette,
  Eye,
  EyeOff,
  Plus,
  X,
  Camera,
  Save,
  Check,
  Globe,
  Clock,
  LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { usersApi } from "../api/client";
import { useAuthStore } from "../store/authStore";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "profile" | "security" | "notifications" | "appearance";

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  group_notifications: boolean;
  announcement_notifications: boolean;
  discussion_notifications: boolean;
  follow_notifications: boolean;
  like_notifications: boolean;
}

type Density = "compact" | "comfortable" | "spacious";

// ─── Sub-components ──────────────────────────────────────────────────────────

/** A small chip tag with a remove button */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary-400/10 text-primary-400 border border-primary-400/20 rounded-full px-3 py-1 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-red-400 transition-colors ml-0.5"
        aria-label={`Remove ${label}`}
      >
        <X size={11} />
      </button>
    </span>
  );
}

/** An input + add button for chip lists */
function ChipInput({
  value,
  onChange,
  onAdd,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-[#202221] border border-gray-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary-400/50 placeholder-gray-600 transition-colors"
      />
      <button
        type="button"
        onClick={onAdd}
        className="bg-primary-400/10 hover:bg-primary-400/20 border border-primary-400/20 text-primary-400 rounded-xl px-3 transition-colors"
        aria-label="Add"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

/** Toggle switch */
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-primary-400" : "bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/** Password input with show/hide toggle */
function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-[#202221] border border-gray-800 rounded-xl py-3 px-4 pr-11 text-white text-sm focus:outline-none focus:border-primary-400/50 placeholder-gray-600 transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

/** Section card wrapper */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-white font-semibold text-base">{title}</h3>
        {description && (
          <p className="text-gray-500 text-sm mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Form field wrapper */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={16} /> },
    { id: "security", label: "Security", icon: <Lock size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#121413] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your account, security, and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <nav className="lg:w-52 shrink-0">
            <ul className="flex lg:flex-col gap-1">
              {tabs.map((tab) => (
                <li key={tab.id} className="flex-1 lg:flex-none">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                      activeTab === tab.id
                        ? "bg-primary-400/10 text-primary-400"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tab content */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "appearance" && <AppearanceTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state initialised from store
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [faculty, setFaculty] = useState(user?.faculty ?? "");

  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.profile_picture ?? "",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep local state in sync if the store user changes externally
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setBio(user.bio ?? "");
      setDepartment(user.department ?? "");
      setFaculty(user.faculty ?? "");
      setSkills(user.skills ?? []);
      setInterests(user.interests ?? []);
      setAvatarPreview(user.profile_picture ?? "");
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile) return null;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", avatarFile);
      const { data } = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.profile_picture ?? data.avatar_url ?? null;
    } catch {
      toast.error("Failed to upload profile picture");
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  }

  function addInterest() {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
    }
    setInterestInput("");
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    setSaving(true);
    try {
      // Upload new avatar first if one was selected
      let profilePicture = user?.profile_picture ?? "";
      if (avatarFile) {
        const url = await uploadAvatar();
        if (url) profilePicture = url;
      }

      const payload: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim(),
        department: department.trim(),
        faculty: faculty.trim(),
        skills,
        interests,
        profile_picture: profilePicture,
      };

      const { data } = await usersApi.update(payload);
      setUser(data);
      setAvatarFile(null);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  return (
    <>
      {/* Avatar section */}
      <Section
        title="Profile Picture"
        description="Upload a photo that represents you"
      >
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#202221] border border-gray-800 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary-400">
                  {initials}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 bg-primary-400 hover:bg-primary-300 text-dark-bg rounded-full p-1.5 transition-colors"
              aria-label="Change profile picture"
            >
              <Camera size={12} />
            </button>
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-gray-800 text-gray-400 hover:text-white rounded-xl py-2.5 px-4 text-sm transition-colors self-start"
            >
              {uploadingAvatar ? "Uploading…" : "Choose Image"}
            </button>
            <p className="text-xs text-gray-600">JPG, PNG or WebP. Max 5 MB.</p>
            {avatarFile && (
              <p className="text-xs text-primary-400 truncate">
                {avatarFile.name}
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </Section>

      {/* Basic info */}
      <Section
        title="Basic Information"
        description="Update your public profile details"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" htmlFor="firstName">
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="bg-[#202221] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary-400/50 placeholder-gray-600 transition-colors"
            />
          </Field>
          <Field label="Last Name" htmlFor="lastName">
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="bg-[#202221] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary-400/50 placeholder-gray-600 transition-colors"
            />
          </Field>
          <Field label="Department" htmlFor="department">
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="bg-[#202221] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary-400/50 placeholder-gray-600 transition-colors"
            />
          </Field>
          <Field label="Faculty" htmlFor="faculty">
            <input
              id="faculty"
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="e.g. Engineering"
              className="bg-[#202221] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary-400/50 placeholder-gray-600 transition-colors"
            />
          </Field>
        </div>

        <Field label="Bio" htmlFor="bio">
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself…"
            rows={3}
            maxLength={500}
            className="bg-[#202221] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary-400/50 placeholder-gray-600 transition-colors resize-none"
          />
          <p className="text-xs text-gray-600 text-right">{bio.length}/500</p>
        </Field>
      </Section>

      {/* Skills */}
      <Section title="Skills" description="Add skills to help others find you">
        <ChipInput
          value={skillInput}
          onChange={setSkillInput}
          onAdd={addSkill}
          placeholder="Add a skill (e.g. Python)"
        />
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <Chip
                key={s}
                label={s}
                onRemove={() =>
                  setSkills((prev) => prev.filter((x) => x !== s))
                }
              />
            ))}
          </div>
        )}
        {skills.length === 0 && (
          <p className="text-xs text-gray-600">No skills added yet.</p>
        )}
      </Section>

      {/* Interests */}
      <Section title="Interests" description="Topics you're passionate about">
        <ChipInput
          value={interestInput}
          onChange={setInterestInput}
          onAdd={addInterest}
          placeholder="Add an interest (e.g. Machine Learning)"
        />
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <Chip
                key={i}
                label={i}
                onRemove={() =>
                  setInterests((prev) => prev.filter((x) => x !== i))
                }
              />
            ))}
          </div>
        )}
        {interests.length === 0 && (
          <p className="text-xs text-gray-600">No interests added yet.</p>
        )}
      </Section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingAvatar}
          className="inline-flex items-center gap-2 bg-primary-400 hover:bg-primary-300 disabled:opacity-60 disabled:cursor-not-allowed text-dark-bg font-bold rounded-xl py-2.5 px-6 text-sm transition-colors"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-dark-bg/40 border-t-dark-bg rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save size={15} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  function validate(): string | null {
    if (!currentPassword) return "Please enter your current password";
    if (!newPassword) return "Please enter a new password";
    if (newPassword.length < 6)
      return "New password must be at least 6 characters";
    if (newPassword !== confirmPassword) return "New passwords do not match";
    if (currentPassword === newPassword)
      return "New password must differ from the current password";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      await api.post("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const msg = error?.response?.data?.detail ?? "Failed to change password";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const passwordStrength = (() => {
    if (!newPassword) return null;
    if (newPassword.length < 6)
      return { level: "Weak", color: "bg-red-500", width: "w-1/4" };
    if (newPassword.length < 8)
      return { level: "Fair", color: "bg-yellow-500", width: "w-2/4" };
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      return { level: "Good", color: "bg-blue-500", width: "w-3/4" };
    return { level: "Strong", color: "bg-primary-400", width: "w-full" };
  })();

  return (
    <>
      <Section
        title="Change Password"
        description="Keep your account secure with a strong password"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput
            id="currentPassword"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <PasswordInput
            id="newPassword"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />

          {/* Strength meter */}
          {passwordStrength && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Password strength</span>
                <span
                  className={`font-medium ${
                    passwordStrength.level === "Strong"
                      ? "text-primary-400"
                      : passwordStrength.level === "Good"
                        ? "text-blue-400"
                        : passwordStrength.level === "Fair"
                          ? "text-yellow-400"
                          : "text-red-400"
                  }`}
                >
                  {passwordStrength.level}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
                />
              </div>
            </div>
          )}

          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />

          {/* Match indicator */}
          {confirmPassword && (
            <p
              className={`text-xs flex items-center gap-1.5 ${
                confirmPassword === newPassword
                  ? "text-primary-400"
                  : "text-red-400"
              }`}
            >
              {confirmPassword === newPassword ? (
                <>
                  <Check size={12} />
                  Passwords match
                </>
              ) : (
                <>
                  <X size={12} />
                  Passwords do not match
                </>
              )}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary-400 hover:bg-primary-300 disabled:opacity-60 disabled:cursor-not-allowed text-dark-bg font-bold rounded-xl py-2.5 px-6 text-sm transition-colors"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-dark-bg/40 border-t-dark-bg rounded-full animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <Lock size={15} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </Section>

      {/* Account info (read-only) */}
      <Section title="Account Information" description="Your account details">
        <AccountInfoRow
          label="Username"
          value={useAuthStore.getState().user?.username ?? "—"}
        />
        <AccountInfoRow
          label="Email"
          value={useAuthStore.getState().user?.email ?? "—"}
        />
        <AccountInfoRow
          label="Role"
          value={
            (useAuthStore.getState().user?.role ?? "—")
              .charAt(0)
              .toUpperCase() +
            (useAuthStore.getState().user?.role ?? "").slice(1)
          }
        />
        <AccountInfoRow
          label="Member since"
          value={
            useAuthStore.getState().user?.created_at
              ? new Date(
                  useAuthStore.getState().user!.created_at,
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"
          }
        />
      </Section>
    </>
  );
}

function AccountInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-900 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-300 font-medium">{value}</span>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

const NOTIFICATION_KEYS: {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "email_notifications",
    label: "Email Notifications",
    description: "Receive activity summaries and alerts via email",
  },
  {
    key: "push_notifications",
    label: "Push Notifications",
    description: "Browser or device push alerts for real-time updates",
  },
  {
    key: "message_notifications",
    label: "Message Notifications",
    description: "Get notified when you receive a new direct message",
  },
  {
    key: "group_notifications",
    label: "Group Notifications",
    description: "Updates on activity in groups you belong to",
  },
  {
    key: "announcement_notifications",
    label: "Announcement Notifications",
    description: "Faculty and department announcements",
  },
  {
    key: "discussion_notifications",
    label: "Discussion Notifications",
    description: "Replies and activity on discussions you follow",
  },
  {
    key: "follow_notifications",
    label: "Follow Notifications",
    description: "When someone starts following your profile",
  },
  {
    key: "like_notifications",
    label: "Like Notifications",
    description: "When someone likes your posts or resources",
  },
];

const defaultNotificationSettings: NotificationSettings = {
  email_notifications: true,
  push_notifications: true,
  message_notifications: true,
  group_notifications: true,
  announcement_notifications: true,
  discussion_notifications: true,
  follow_notifications: false,
  like_notifications: false,
};

function NotificationsTab() {
  const [settings, setSettings] = useState<NotificationSettings>(
    defaultNotificationSettings,
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof NotificationSettings | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get("/users/me/notification-settings");
        if (!cancelled)
          setSettings({ ...defaultNotificationSettings, ...data });
      } catch {
        // Use defaults silently — backend endpoint may not exist yet
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle(key: keyof NotificationSettings, value: boolean) {
    // Optimistic update
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSavingKey(key);
    try {
      // Send full settings object so backend merges correctly
      await api.patch("/users/me/notification-settings", newSettings);
    } catch {
      // Revert on failure
      setSettings(settings);
      toast.error("Failed to update notification settings");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Section
      title="Notification Preferences"
      description="Choose what you want to be notified about"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <span className="w-6 h-6 border-2 border-gray-700 border-t-primary-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-900">
          {NOTIFICATION_KEYS.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="pr-4">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <Toggle
                checked={settings[key]}
                onChange={(v) => handleToggle(key, v)}
                disabled={savingKey === key}
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "ar", label: "Arabic" },
  { value: "pt", label: "Portuguese" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese (Simplified)" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "America/New_York", label: "UTC-5 — Eastern Time (US)" },
  { value: "America/Chicago", label: "UTC-6 — Central Time (US)" },
  { value: "America/Denver", label: "UTC-7 — Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "UTC-8 — Pacific Time (US)" },
  { value: "Europe/London", label: "UTC+0 — London" },
  { value: "Europe/Paris", label: "UTC+1 — Paris / Berlin" },
  { value: "Africa/Lagos", label: "UTC+1 — Lagos / West Africa" },
  { value: "Africa/Nairobi", label: "UTC+3 — Nairobi / East Africa" },
  { value: "Asia/Dubai", label: "UTC+4 — Dubai" },
  { value: "Asia/Kolkata", label: "UTC+5:30 — India" },
  { value: "Asia/Singapore", label: "UTC+8 — Singapore / Beijing" },
  { value: "Asia/Tokyo", label: "UTC+9 — Tokyo" },
  { value: "Australia/Sydney", label: "UTC+11 — Sydney" },
];

const DENSITIES: { value: Density; label: string; description: string }[] = [
  {
    value: "compact",
    label: "Compact",
    description: "More content, less spacing",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Balanced spacing (default)",
  },
  {
    value: "spacious",
    label: "Spacious",
    description: "Generous padding and whitespace",
  },
];

function AppearanceTab() {
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [density, setDensity] = useState<Density>("comfortable");

  const selectClass =
    "bg-[#202221] border border-gray-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary-400/50 transition-colors appearance-none cursor-pointer w-full";

  return (
    <>
      {/* Theme */}
      <Section
        title="Theme"
        description="EduConnect always uses a dark theme for the best experience"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[#202221] border border-primary-400/30 rounded-xl px-4 py-3 flex-1">
            <div className="w-4 h-4 rounded-full bg-[#121413] border-2 border-primary-400" />
            <span className="text-sm text-white font-medium">Dark Mode</span>
            <Check size={14} className="text-primary-400 ml-auto" />
          </div>
          <div className="flex items-center gap-3 bg-[#202221] border border-gray-800 rounded-xl px-4 py-3 flex-1 opacity-40 cursor-not-allowed">
            <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-400" />
            <span className="text-sm text-gray-400 font-medium">
              Light Mode
            </span>
            <span className="text-xs text-gray-600 ml-auto">Soon</span>
          </div>
        </div>
      </Section>

      {/* Display density */}
      <Section
        title="Display Density"
        description="Adjust how compact or spacious the interface feels"
      >
        <div className="grid grid-cols-3 gap-3">
          {DENSITIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDensity(d.value)}
              className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-colors ${
                density === d.value
                  ? "border-primary-400/50 bg-primary-400/5"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              <LayoutGrid
                size={18}
                className={
                  density === d.value ? "text-primary-400" : "text-gray-500"
                }
              />
              <span
                className={`text-sm font-medium ${
                  density === d.value ? "text-white" : "text-gray-400"
                }`}
              >
                {d.label}
              </span>
              <span className="text-xs text-gray-600 leading-snug">
                {d.description}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Language */}
      <Section
        title="Language & Region"
        description="Set your preferred language and timezone"
      >
        <Field label="Language" htmlFor="language">
          <div className="relative">
            <Globe
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`${selectClass} pl-9`}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Timezone" htmlFor="timezone">
          <div className="relative">
            <Clock
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={`${selectClass} pl-9`}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <p className="text-xs text-gray-600">
          Language and timezone preferences are saved locally and will be
          applied in a future update.
        </p>
      </Section>
    </>
  );
}
