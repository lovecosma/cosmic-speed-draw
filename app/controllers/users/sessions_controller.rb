class Users::SessionsController < Devise::SessionsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    render json: { user: { id: resource.id, email: resource.email } }
  end

  def respond_to_on_destroy
    if current_user
      render json: { message: "Signed out successfully" }
    else
      render json: { message: "No active session" }, status: :unauthorized
    end
  end
end
