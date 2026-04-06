class JwtService
  ALGORITHM = "HS256"
  USER_EXPIRY        = 15.minutes
  PROVISIONAL_EXPIRY = 7.days

  def self.encode(user_id)
    build_token(user_id, type: "user", expiry: USER_EXPIRY)
  end

  def self.encode_provisional(provisional_user_id)
    build_token(provisional_user_id, type: "provisional", expiry: PROVISIONAL_EXPIRY)
  end

  # Returns the decoded payload (including "type") or nil if invalid/blacklisted.
  def self.decode(token)
    payload, = JWT.decode(token, secret, true, algorithms: [ ALGORITHM ])
    return nil if JwtBlacklist.exists?(jti: payload["jti"])

    payload
  rescue JWT::DecodeError
    nil
  end

  # Blacklists the token. Tolerates already-expired tokens (e.g. sign-out after idle).
  def self.revoke(token)
    return unless token

    payload, = JWT.decode(token, secret, true, algorithms: [ ALGORITHM ], verify_expiration: false)
    JwtBlacklist.create!(jti: payload["jti"], exp: Time.zone.at(payload["exp"]))
  rescue JWT::DecodeError
    nil
  end

  def self.build_token(id, type:, expiry:)
    payload = {
      sub:  id.to_s,
      type: type,
      jti:  SecureRandom.uuid,
      iat:  Time.current.to_i,
      exp:  expiry.from_now.to_i
    }
    JWT.encode(payload, secret, ALGORITHM)
  end
  private_class_method :build_token

  def self.secret
    ENV.fetch("DEVISE_JWT_SECRET_KEY")
  end
  private_class_method :secret
end
