class Users::SessionsController < Devise::SessionsController
  include RefreshTokenManageable

  respond_to :json

  # Devise's verify_signed_out_user uses warden.user() which only reads from the
  # Warden session. JWT auth never writes to the session (store? = false), so
  # all_signed_out? always returns true and would block every sign-out. We skip
  # it and check the Authorization header ourselves in respond_to_on_destroy.
  skip_before_action :verify_signed_out_user

  private

  def respond_with(resource, _opts = {})
    if resource&.persisted?
      issue_refresh_token(resource, response)
      render json: { user: { id: resource.id, email: resource.email } }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def respond_to_on_destroy(non_navigational_status: :no_content)
    revoke_refresh_token(request, response)
    if request.authorization.present?
      render json: { message: "Signed out successfully" }
    else
      render json: { message: "No active session" }, status: :unauthorized
    end
  end
end
