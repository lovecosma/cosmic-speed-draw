class AuthSessionService
  JWT_COOKIE = "jwt_token"
  REFRESH_COOKIE = RefreshToken::COOKIE_NAME
  COOKIE_OPTIONS = {
    httponly: true,
    secure: Rails.env.production?,
    same_site: :lax,
    path: "/"
  }.freeze

  def initialize(request:, response:)
    @request = request
    @response = response
  end

  def issue_for(user)
    set_jwt_cookie(user)
    set_refresh_cookie(RefreshToken.generate_for(user))
  end

  def rotate_from_refresh_cookie
    refresh_token = current_refresh_token
    return nil unless refresh_token&.active?

    user = refresh_token.user
    refresh_token.revoke!
    issue_for(user)
    user
  end

  def revoke_current_session
    token = @request.authorization&.delete_prefix("Bearer ")
    unless token
      clear_cookies
      return false
    end

    JwtService.revoke(token)
    current_refresh_token&.revoke!
    clear_cookies
    true
  end

  private

  def current_refresh_token
    return @current_refresh_token if defined?(@current_refresh_token)

    cookie = @request.cookies[REFRESH_COOKIE]
    @current_refresh_token = cookie && RefreshToken.find_by(token: cookie)
  end

  def set_jwt_cookie(user)
    @response.set_cookie(JWT_COOKIE, COOKIE_OPTIONS.merge(value: JwtService.encode(user.id)))
  end

  def set_refresh_cookie(refresh_token)
    @response.set_cookie(REFRESH_COOKIE, COOKIE_OPTIONS.merge(
      value: refresh_token.token,
      expires: refresh_token.expires_at
    ))
  end

  def clear_cookies
    @response.delete_cookie(JWT_COOKIE, { path: "/" })
    @response.delete_cookie(REFRESH_COOKIE, { path: "/" })
  end
end
