import { Loader2 } from "lucide-react";

// Shared "outline that fills paper on hover" CTA — used by the login
// form's submits (Masuk / Daftar / Simpan PIN / admin sign-in), the
// promo section link, and the rental form's payment handoff.
// `full` spans the container with the icon pushed to the far edge (form
// submits); non-full hugs its content with the icon flush after the
// label (link-style CTAs). Pass `as={Link}` + `to` for a route link
// instead of a submit button.
export default function Button({
  as: Tag = "button",
  icon: Icon,
  loading = false,
  full = false,
  uppercase = false,
  className = "",
  children,
  ...rest
}) {
  const classes = [
    "btn-outline btn-outline--paper press-btn group flex items-center gap-2",
    full ? "w-full justify-between" : "justify-center",
    "py-3.5 px-6 font-body font-bold",
    uppercase && "uppercase tracking-wide",
    "disabled:opacity-50 disabled:pointer-events-none",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...rest}>
      <span>{children}</span>
      {loading ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      ) : (
        Icon && (
          <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )
      )}
    </Tag>
  );
}
