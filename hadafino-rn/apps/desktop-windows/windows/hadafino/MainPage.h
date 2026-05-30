#pragma once
#include "winrt/Microsoft.ReactNative.h"
#include "NativeModules.h"

namespace winrt::hadafino::implementation {

// Native module that bridges WinRT ToastNotification to React Native.
// Registered in App.cpp via PackageProviders().Append(make<ReactPackageProvider>()).
REACT_MODULE(RNWindowsNotifications)
struct RNWindowsNotifications {
  REACT_METHOD(scheduleNotification)
  void scheduleNotification(
    std::string id,
    std::string title,
    std::string body,
    std::optional<std::string> timeISO,
    ReactPromise<void> promise) noexcept {
    try {
      auto toastXml = winrt::Windows::UI::Notifications::ToastNotificationManager::
        GetTemplateContent(winrt::Windows::UI::Notifications::ToastTemplateType::ToastText02);

      auto textNodes = toastXml.GetElementsByTagName(L"text");
      textNodes.Item(0).AppendChild(toastXml.CreateTextNode(winrt::to_hstring(title)));
      textNodes.Item(1).AppendChild(toastXml.CreateTextNode(winrt::to_hstring(body)));

      auto toast = winrt::Windows::UI::Notifications::ToastNotification(toastXml);
      toast.Tag(winrt::to_hstring(id));

      winrt::Windows::UI::Notifications::ToastNotificationManager::
        CreateToastNotifier(L"com.hadafino.app").Show(toast);

      promise.Resolve();
    } catch (...) {
      promise.Reject("Failed to show notification");
    }
  }

  REACT_METHOD(cancelNotification)
  void cancelNotification(std::string id, ReactPromise<void> promise) noexcept {
    // ToastNotificationHistory requires package identity — stub for sideloaded builds
    promise.Resolve();
  }

  REACT_METHOD(cancelAllNotifications)
  void cancelAllNotifications(ReactPromise<void> promise) noexcept {
    promise.Resolve();
  }

  REACT_METHOD(requestPermission)
  void requestPermission(ReactPromise<bool> promise) noexcept {
    promise.Resolve(true); // Windows always allows toast by default
  }

  REACT_METHOD(hasPermission)
  void hasPermission(ReactPromise<bool> promise) noexcept {
    promise.Resolve(true);
  }
};

} // namespace winrt::hadafino::implementation
