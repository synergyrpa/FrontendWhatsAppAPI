console.log("wpp_bearer_token:", localStorage.getItem("wpp_bearer_token"));
console.log("wpp_token_expires_at:", localStorage.getItem("wpp_token_expires_at"));
console.log("isTokenValid:", () => {
  try {
    const token = localStorage.getItem("wpp_bearer_token");
    const expiresAt = localStorage.getItem("wpp_token_expires_at");
    
    if (!token || !expiresAt) {
      return false;
    }
    
    // Verifica se o token expira em menos de 5 minutos
    const expirationTime = parseInt(expiresAt);
    const currentTime = Date.now();
    const bufferTime = 300000;  // 5 minutos em ms
    
    return currentTime < (expirationTime - bufferTime);
  } catch (error) {
    console.error("Erro ao verificar validade do token:", error);
    return false;
  }
})
