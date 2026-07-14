export default function CheckoutArtifact() {
  return (
    <div className="checkout-artifact" aria-hidden="true">
      <div className="checkout-artifact__orbit checkout-artifact__orbit--one" />
      <div className="checkout-artifact__orbit checkout-artifact__orbit--two" />
      <div className="checkout-artifact__core">
        <span className="checkout-artifact__face checkout-artifact__face--front" />
        <span className="checkout-artifact__face checkout-artifact__face--right" />
        <span className="checkout-artifact__face checkout-artifact__face--top" />
        <span className="checkout-artifact__cut checkout-artifact__cut--one" />
        <span className="checkout-artifact__cut checkout-artifact__cut--two" />
      </div>
    </div>
  )
}
