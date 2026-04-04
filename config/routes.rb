Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  mount ActionCable.server => "/cable"
  
  scope '/api' do
    devise_for :users, controllers: {
      registrations: "users/registrations",
      sessions: "users/sessions"
    }
  end

  namespace :api do
    get "/user", to: "users#show"
  end
  
  get "*path", to: "fallback#index", constraints: ->(req) { !req.xhr? && req.format.html? }
  root to: "fallback#index"
end
