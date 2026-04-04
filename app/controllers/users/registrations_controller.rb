class Users::RegistrationsController < Devise::RegistrationsController
  include RefreshTokenManageable

  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      issue_refresh_token(resource, response)
      render json: { user: { id: resource.id, email: resource.email } }, status: :created
    else
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_content
    end
  end
end
