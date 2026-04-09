module SessionOwner
  extend ActiveSupport::Concern

  # Depends on BearerTokenRequest being included by the host controller.
  included do
    before_action :authenticate_session!
  end

  private

  def authenticate_session!
    token = bearer_token_from(request)
    payload = token && JwtService.decode(token)
    return render json: { error: "Unauthorized" }, status: :unauthorized unless payload

    @current_owner = case payload["type"]
    when "user"        then User.find_by(id: payload["sub"])
    when "provisional" then ProvisionalUser.find_by(id: payload["sub"])
    end

    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_owner
  end

  def current_owner
    @current_owner
  end

  def owner_scope
    case current_owner
    when User            then { user_id: current_owner.id }
    when ProvisionalUser then { provisional_user_id: current_owner.id }
    end
  end
end
