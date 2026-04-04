class Api::UsersController < Api::AuthController
  def show
    render json: { user: { id: current_user.id, email: current_user.email } }
  end
end
