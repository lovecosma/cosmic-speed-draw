class Users::SessionsController < Devise::SessionsController
  respond_to :json

  # Devise's verify_signed_out_user uses warden.user() which only reads from the
  # Warden session. Since we use stateless JWT auth, the session is never written,
  # so all_signed_out? always returns true and would block every sign-out.
  skip_before_action :verify_signed_out_user

  private

  def respond_with(resource, _opts = {})
    if resource&.persisted?
      AuthSessionService.new(request:, response:).issue_for(resource)
      render json: { user: { id: resource.id, email: resource.email } }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def respond_to_on_destroy(non_navigational_status: :no_content)
    if AuthSessionService.new(request:, response:).revoke_current_session
      render json: { message: "Signed out successfully" }
    else
      render json: { message: "No active session" }, status: :unauthorized
    end
  end
end
