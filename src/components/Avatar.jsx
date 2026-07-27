function initialsFromName(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Avatar({ name = "User", size = 36 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {initialsFromName(name) || "U"}
    </div>
  );
}
