import { OverflowText } from "../../../components/OverflowText.jsx";

export function UserCell({ name, username }) {
  return (
    <div className="min-w-[160px]">
      <OverflowText value={name} className="text-sm font-medium text-foreground" />
      <OverflowText
        value={username ? `@${username}` : null}
        className="text-xs text-muted-foreground"
      />
    </div>
  );
}
