class JwtService
  ALGORITHM = "HS256"
  EXPIRY = 15.minutes

  def self.encode(user_id)
    payload = {
      sub: user_id.to_s,
      jti: SecureRandom.uuid,
      iat: Time.current.to_i,
      exp: EXPIRY.from_now.to_i
    }
    JWT.encode(payload, secret, ALGORITHM)
  end

  # Returns the decoded payload or nil if the token is invalid or blacklisted.
  def self.decode(token)
    payload, = JWT.decode(token, secret, true, algorithms: [ALGORITHM])
    return nil if JwtBlacklist.exists?(jti: payload["jti"])

    payload
  rescue JWT::DecodeError
    nil
  end

  # Blacklists the token so it cannot be reused. Verifies the signature but
  # tolerates an already-expired token (e.g. a sign-out after a long idle).
  def self.revoke(token)
    payload, = JWT.decode(token, secret, true, algorithms: [ALGORITHM], verify_expiration: false)
    JwtBlacklist.create!(jti: payload["jti"], exp: Time.zone.at(payload["exp"]))
  rescue JWT::DecodeError
    nil
  end

  def self.secret
    ENV.fetch("DEVISE_JWT_SECRET_KEY")
  end
  private_class_method :secret
end
