class Api::TokensController < ApplicationController
  def create
    user = AuthSessionService.new(request:, response:).rotate_from_refresh_cookie
    unless user
      return render json: { error: "Invalid or expired refresh token" }, status: :unauthorized
    end

    render json: { user: { id: user.id, email: user.email } }
  end
end
