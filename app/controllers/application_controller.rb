class ApplicationController < ActionController::API
  include BearerTokenRequest

  before_action :configure_permitted_parameters, if: :devise_controller?

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [ :email ])
    devise_parameter_sanitizer.permit(:sign_in, keys: [ :email ])
  end

  def provisional_user_from_request
    token = bearer_token_from(request)
    return unless token

    payload = JwtService.decode(token)
    return unless payload&.fetch("type", nil) == "provisional"

    ProvisionalUser.find_by(id: payload["sub"])
  end

  def migrate_provisional_session!(real_user:)
    provisional_user = provisional_user_from_request
    return unless provisional_user

    JwtService.revoke(bearer_token_from(request))
    ProvisionalMigrator.new(provisional_user, real_user).migrate!
  end
end
