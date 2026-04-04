class Api::AuthController < ApplicationController
  before_action :authenticate_user!

  private

  def render_unauthorized(exception)
    render json: { error: "Unauthorized" }, status: :unauthorized
  end
end
