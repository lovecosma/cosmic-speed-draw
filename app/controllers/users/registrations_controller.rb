class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      migrate_provisional_session!(real_user: resource)
      AuthSessionService.new(request:, response:).issue_for(resource)
      render json: { user: { id: resource.id, email: resource.email, provisional: false } }, status: :created
    else
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_content
    end
  end
end
