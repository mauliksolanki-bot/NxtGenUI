import mark from '../assets/nxtgen-logo.svg'
import './Logo.css'

export default function Logo({ size = 40, showWordmark = true, inverted = false }) {
  return (
    <div className={`brand-logo${inverted ? ' inverted' : ''}`}>
      <img src={mark} alt="" width={size} height={size} className="brand-logo-mark" />
      {showWordmark ? (
        <span className="brand-logo-word">
          Nxt<span>Gen</span>
        </span>
      ) : null}
    </div>
  )
}
