/**
 * Logo Legacy — soleil levant.
 * Recréation SVG fidèle du Logo.png : corps jaune rempli + rayons orange + lignes horizon.
 * Prop `size` contrôle la taille, fond transparent (s'adapte au dark/light).
 */
export default function BaobabLogo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Legacy — soleil levant"
    >
      {/* Corps du soleil — demi-cercle rempli */}
      <path
        d="M 17 52 A 23 23 0 0 1 63 52 Z"
        fill="#FEDB5C"
      />

      {/* Rayons — orange arrondi */}
      {/* Vertical top */}
      <line x1="40" y1="26" x2="40" y2="17" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      {/* ±22° */}
      <line x1="49.2" y1="28.8" x2="52.8" y2="20.4" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      <line x1="30.8" y1="28.8" x2="27.2" y2="20.4" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      {/* ±43° */}
      <line x1="56.6" y1="35.3" x2="62.8" y2="28.6" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      <line x1="23.4" y1="35.3" x2="17.2" y2="28.6" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      {/* ±63° */}
      <line x1="61.5" y1="41.8" x2="69.6" y2="37.7" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      <line x1="18.5" y1="41.8" x2="10.4" y2="37.7" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      {/* ±82° quasi-horizontal */}
      <line x1="63.8" y1="49.5" x2="72.8" y2="48.2" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>
      <line x1="16.2" y1="49.5" x2="7.2"  y2="48.2" stroke="#F5A227" strokeWidth="4.2" strokeLinecap="round"/>

      {/* Lignes horizon */}
      <line x1="4"  y1="52" x2="76" y2="52" stroke="#F5A227" strokeWidth="4" strokeLinecap="round"/>
      <line x1="10" y1="61" x2="70" y2="61" stroke="#F5A227" strokeWidth="4" strokeLinecap="round"/>
      <line x1="18" y1="70" x2="62" y2="70" stroke="#F5A227" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}
