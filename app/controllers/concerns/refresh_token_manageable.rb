module RefreshTokenManageable
  extend ActiveSupport::Concern

  REFRESH_COOKIE = RefreshToken::COOKIE_NAME

  def issue_refresh_token(user, response)
    rt = RefreshToken.generate_for(user)
    response.set_cookie(REFRESH_COOKIE, {
      value: rt.token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      path: "/",
      expires: rt.expires_at
    })
  end

  def revoke_refresh_token(request, response)
    token = request.cookies[REFRESH_COOKIE]
    RefreshToken.find_by(token: token)&.revoke!
    response.delete_cookie(REFRESH_COOKIE, { path: "/" })
  end
end
