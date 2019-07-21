export function isIE() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf("Trident/7.0");

  return msie > 0;
}