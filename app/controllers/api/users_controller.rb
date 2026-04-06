class Api::UsersController < Api::AuthController
  def show
    u = current_user
    render json: { user: { id: u.id, email: u.email, provisional: false } }
  end
end
