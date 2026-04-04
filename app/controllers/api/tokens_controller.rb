class Api::TokensController < ApplicationController
  include RefreshTokenManageable

  def create
    token_value = request.cookies[REFRESH_COOKIE]
    rt = token_value && RefreshToken.find_by(token: token_value)

    unless rt&.active?
      return render json: { error: "Invalid or expired refresh token" }, status: :unauthorized
    end

    user = rt.user

    # Token rotation: revoke old, issue new refresh token
    rt.revoke!
    issue_refresh_token(user, response)

    # Issue a new JWT via devise-jwt's encoder so the denylist stays consistent
    jwt, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    response.set_cookie("jwt_token", {
      value: jwt,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      path: "/"
    })

    render json: { user: { id: user.id, email: user.email } }
  end
end
