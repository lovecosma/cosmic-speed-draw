class FallbackController < ActionController::Base
  def index
    if Rails.env.development?
      redirect_to "#{ENV.fetch('VITE_DEV_URL', 'http://localhost:5173')}#{request.fullpath}", allow_other_host: true
    else
      send_file Rails.root.join("public/index.html")
    end
  end
end
