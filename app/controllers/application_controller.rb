class ApplicationController < ActionController::API
  include BearerTokenRequest

  before_action :configure_permitted_parameters, if: :devise_controller?

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [ :email ])
    devise_parameter_sanitizer.permit(:sign_in, keys: [ :email ])
  end

  def migrate_provisional_session!(real_user:)
    # Read directly from the cookie rather than the Authorization header. The
    # middleware copies the cookie into the header, but a caller could also
    # supply a raw Bearer token — migration must only happen for the browser's
    # own session arriving via the secure HttpOnly cookie transport.
    token = request.cookies["jwt_token"]
    return unless token

    payload = JwtService.decode(token)
    return unless payload&.fetch("type", nil) == "provisional"

    provisional_user = ProvisionalUser.find_by(id: payload["sub"])
    return unless provisional_user

    JwtService.revoke(token)
    ProvisionalMigrator.new(provisional_user, real_user).migrate!
  end
end
