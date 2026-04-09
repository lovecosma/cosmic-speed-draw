Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  mount ActionCable.server => "/cable"

  scope "/api" do
    devise_for :users, controllers: {
      registrations: "users/registrations",
      sessions: "users/sessions"
    }
  end

  namespace :api do
    post "/provisional_sessions", to: "provisional_sessions#create"
    get  "/user",                 to: "users#show"
    post "/refresh",              to: "tokens#create"
    resources :drawings, only: [ :index, :create, :show, :update, :destroy ]
  end

  get "*path", to: "fallback#index"
  root to: "fallback#index"
end
