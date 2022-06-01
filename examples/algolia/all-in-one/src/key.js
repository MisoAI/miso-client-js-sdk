function rotate(str, i) {
  return window.btoa(String.fromCharCode(...[...window.atob(str)].map(c => (i * c.charCodeAt(0)) % 256)));
}

export default rotate('kvoJG2c1Tgs1zeRHNz44dL28iPeNuWSywyI4K4Og', 29);
