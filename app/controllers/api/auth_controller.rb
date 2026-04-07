class Api::AuthController < ApplicationController
  before_action :authenticate_user!

  private

  def authenticate_user!
    token = bearer_token_from(request)
    payload = token && JwtService.decode(token)
    @current_user = payload && payload["type"] == "user" && User.find_by(id: payload["sub"])
    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end

  def current_user
    @current_user
  end
end
