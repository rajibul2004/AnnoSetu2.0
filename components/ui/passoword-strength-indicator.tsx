"use client";


export default function PasswordStrengthIndicator(props: { password: string }) {
  const { password } = props;
  let s = 0;
  if (password.length >= 8) s++;
  if (/[A-Z]/.test(password)) s++;
  if (/[a-z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;

  return (
    <div className="px-1 mt-1">
      <div className="flex gap-1 h-1.5 w-full mb-1">
        {[1, 2, 3, 4, 5].map((level) => {
          let color = "bg-gray-200 dark:bg-gray-700";
          if (s >= level) {
            if (s <= 2) color = "bg-red-500 dark:bg-red-400";
            else if (s === 3) color = "bg-yellow-500 dark:bg-yellow-400";
            else if (s === 4) color = "bg-blue-500 dark:bg-blue-400";
            else color = "bg-green-500 dark:bg-green-400";
          }
          return (
            <div
              key={level}
              className={`h-full flex-1 rounded-full transition-colors ${color}`}
            />
          );
        })}
      </div>
      <div
        className={`text-xs text-right font-medium ${
          s <= 2
            ? "text-red-500/20"
            : s === 3
              ? "text-yellow-500/20"
              : s === 4
                ? "text-blue-500/20"
                : "text-green-500/20"
        }`}
      >
        {s <= 2 ? "Weak" : s === 3 ? "Fair" : s === 4 ? "Good" : "Strong"}
      </div>
    </div>
  );
}
