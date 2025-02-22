# frozen_string_literal: false

require 'socket'
require 'selenium-webdriver'

module Applitools::Selenium
  class Driver < SimpleDelegator
    extend Forwardable

    RIGHT_ANGLE = 90
    # @!visibility private
    IOS = 'IOS'.freeze
    # @!visibility private
    ANDROID = 'ANDROID'.freeze
    # @!visibility private
    LANDSCAPE = 'LANDSCAPE'.freeze

    # Available finders
    FINDERS = {
      class: 'class name',
      class_name: 'class name',
      css: 'css',
      id: 'id',
      link: 'link text',
      link_text: 'link text',
      name: 'name',
      partial_link_text: 'partial link text',
      tag_name: 'tag name',
      xpath: 'xpath'
    }.freeze

    attr_reader :browser
    attr_accessor :rotation

    def_delegators :@eyes, :add_mouse_trigger, :add_text_trigger, :utils
    def_delegators :@browser, :user_agent
    def_delegators 'Applitools::EyesLogger', :logger, :log_handler, :log_handler=

    # Initializes a class instance.
    #
    # If driver is not provided, Applitools::Selenium::Driver will raise an EyesError exception.
    # @param eyes [Applitools::Selenium::Eyes] The eyes instance.
    # @param options [Hash] The options.
    # @option options [Selenium::WebDriver::Driver] :driver The Selenium webdriver instance.
    # @option options [Boolean] :is_mobile_device Whether is a mobile device or not.
    def initialize(eyes, options)
      super(options[:driver])
      @is_mobile_device = options.fetch(:is_mobile_device, false)
      @eyes = eyes
      @frame_chain = Applitools::Selenium::FrameChain.new
      @browser = Applitools::Selenium::Browser.new(self, @eyes)
      Applitools::EyesLogger.warn '"screenshot_as" method not found!' unless driver.respond_to? :screenshot_as
    end

    # Executes javascript in browser context.
    #
    # @raise [Applitools::EyesDriverOperationException]
    def execute_script(*args)
      raises_error { __getobj__.execute_script(*args) }
    end

    # Returns the platform name.
    #
    # @return [String] The platform name or +nil+ if it is undefined.
    # def platform_name
    #   capabilities['platformName']
    # end

    # Returns the platform version.
    #
    # @return [String] The platform version or +nil+ if it is undefined.
    # def platform_version
    #   version = capabilities['platformVersion']
    #   version.nil? ? nil : version.to_s
    # end

    # Returns +true+ if the driver orientation is landscape.
    def landscape_orientation?
      driver.orientation.to_s.upcase == LANDSCAPE
    rescue NameError, Selenium::WebDriver::Error::WebDriverError, Selenium::WebDriver::Error::UnknownError
      Applitools::EyesLogger.debug 'driver has no "orientation" attribute. Assuming: portrait.'
      false
    end

    # Returns +true+ if the platform running the test is a mobile platform. +false+ otherwise.
    def mobile_device?
      # We CAN'T check if the device is an +Appium::Driver+ since it is not a RemoteWebDriver. Because of that we use a
      # flag we got as an option in the constructor.
      @is_mobile_device
    end

    # Hide the main document's scrollbars and returns the original overflow value.
    def hide_scrollbars
      @browser.hide_scrollbars
    end

    # Set the overflow value for document element and return the original overflow value.
    def overflow=(overflow)
      @browser.set_overflow(overflow)
    end

    # Returns native driver
    #
    # @return Selenium::WebDriver
    def remote_web_driver
      driver
    end

    alias set_overflow overflow=

    # Takes a screenshot.
    #
    # @param [:Symbol] format A format to store screenshot (one of +:base64+ or +:png+)
    # @return [String] A byte string, representing the screenshot
    def screenshot_as(format)
      raise "Invalid format (#{format}) passed! Available formats: :png, :base64" unless [:base64, :png].include? format
      png_screenshot = driver.screenshot_as(:png)
      yield png_screenshot if block_given?
      screenshot = Applitools::Screenshot.from_any_image(png_screenshot)
      self.class.normalize_rotation(self, screenshot, rotation)
      return Applitools::Utils::ImageUtils.base64_from_png_image(screenshot.restore) if format == :base64
      screenshot.to_blob
    end

    # Finds an element in a window.
    # @param [Symbol] how Defines the way that +what+ parameter will be interpreted (finder). Can be one
    #   of: +:class+, +:class_name+, +:css+, +:id+, +:link+, +:link_text+, +:name+, +:partial_link_text+, +:tag_name+,
    #   +:xpath+
    # @param [String] what The selector to find an element
    # @example
    #   driver.find_element :css, '.some_class'
    # @example
    #   driver.find_element :css => '.some_class'
    # @example
    #   driver.find_element :id, 'element_id'
    # @raise [ArgumentError] if invalid finder (+how+) is passed
    # @return [Applitools::Selenium::Element]
    # @!parse def find_element(how, what); end

    def find_element(*args)
      how, what = extract_args(args)
      return find_element_by_name_or_id(what) if how == :name_or_id
      # Make sure that "how" is a valid locator.
      raise ArgumentError, "cannot find element by: #{how.inspect}" unless FINDERS[how.to_sym]

      Applitools::Selenium::Element.new(self, driver.find_element(how, what))
    end

    def find_element_by_name_or_id(name_or_id)
      found_by_name = find_elements name: name_or_id
      return found_by_name.first unless found_by_name.empty?
      find_element id: name_or_id
    end

    # Finds elements in a window.
    # @param [Symbol] how Defines the way that +what+ parameter will be interpreted (finder). Can be one
    #   of: +:class+, +:class_name+, +:css+, +:id+, +:link+, +:link_text+, +:name+, +:partial_link_text+, +:tag_name+,
    #   +:xpath+
    # @param [String] what The selector to find an element
    # @example
    #   driver.find_elements :css, '.some_class'
    # @example
    #   driver.find_elements :css => '.some_class'
    # @example
    #   driver.find_elements :id, 'element_id'
    # @raise [ArgumentError] if invalid finder (+how+) is passed
    # @return [ [Applitools::Selenium::Element] ]
    # @!parse def find_elements(how, what); end

    def find_elements(*args)
      how, what = extract_args(args)

      raise ArgumentError, "cannot find element by: #{how.inspect}" unless FINDERS[how.to_sym]

      driver.find_elements(how, what).map { |el| Applitools::Selenium::Element.new(self, el) }
    end

    # # Returns +true+ if test is running on Android platform
    # def android?
    #   platform_name.to_s.upcase == ANDROID
    # end
    #
    # # Returns +true+ if test is running on iOS platform
    # def ios?
    #   platform_name.to_s.upcase == IOS
    # end

    # Returns a copy of current frame chain. Frame chain stores information about all parent frames,
    #   including scroll offset an frame coordinates.
    #
    # @return [Applitools::Selenium::FrameChain] The frame chain.
    def frame_chain
      Applitools::Selenium::FrameChain.new other: @frame_chain
    end

    # Returns current frame chain. Frame chain stores information about all parent frames,
    #   including scroll offset an frame coordinates
    def frame_chain!
      @frame_chain
    end

    # Gets +default_content_viewport_size+.
    #
    # @param [Boolean] force_query if set to true, forces querying of viewport size from the browser,
    #   otherwise returns cached value.
    # @return [Applitools::RectangleSize] The default content viewport size.
    def default_content_viewport_size(force_query = false)
      logger.info('default_content_viewport_size()')
      if cached_default_content_viewport_size && !force_query
        logger.info "Using cached viewport_size #{cached_default_content_viewport_size}"
        return cached_default_content_viewport_size
      end

      current_frames = frame_chain
      switch_to.default_content unless current_frames.empty?
      logger.info 'Extracting viewport size...'
      @cached_default_content_viewport_size = utils.extract_viewport_size(self)
      logger.info "Done! Viewport size is #{@cached_default_content_viewport_size}"

      switch_to.frames(frame_chain: current_frames) unless current_frames.empty?
      @cached_default_content_viewport_size
    end

    def switch_to
      @switch_to ||= Applitools::Selenium::EyesTargetLocator.new(
        self, driver.switch_to, FrameChangeEventListener.new(self)
      )
    end

    def universal_driver_config
      if respond_to?(:session_id)
        {
          serverUrl: server_url,
          sessionId: session_id,
          capabilities: capabilities.as_json
        }
      else
        {
          serverUrl: server_url,
          sessionId: bridge.session_id,
          capabilities: capabilities.as_json
        }
      end
    end

    private

    attr_reader :cached_default_content_viewport_size

    def raises_error
      yield if block_given?
    rescue => e
      raise Applitools::EyesDriverOperationException.new e.message
    end

    def bridge
      __getobj__.send(:bridge)
    end

    def driver
      @driver ||= __getobj__
    end

    def server_url
      bridge.http.send(:server_url).to_s
    end

    def extract_args(args)
      case args.size
      when 2
        args
      when 1
        arg = args.first

        raise ArgumentError, "expected #{arg.inspect}:#{arg.class} to respond to #shift" unless arg.respond_to?(:shift)

        # This will be a single-entry hash, so use #shift over #first or #[].
        arg.dup.shift.tap do |arr|
          raise ArgumentError, "expected #{arr.inspect} to have 2 elements" unless arr.size == 2
        end
      else
        raise ArgumentError, "wrong number of arguments (#{args.size} for 2)"
      end
    end

    # @!visibility private
    class FrameChangeEventListener
      extend Forwardable

      def_delegators 'Applitools::EyesLogger', :logger, :log_handler, :log_handler=

      def initialize(parent)
        self.parent = parent
      end

      def will_switch_to_frame(target_type, target_frame)
        logger.info 'will_switch_to_frame()'
        case target_type
        when :default_content
          logger.info 'Default content.'
          parent.frame_chain!.clear
          return nil
        when :parent_frame
          logger.info 'Parent frame.'
          return parent.frame_chain!.pop
        when :frame
          logger.info 'Frame.'
          frame_location_size = Applitools::Selenium::BorderAwareElementContentLocationProvider.new target_frame
          return parent.frame_chain!.push(
            Applitools::Selenium::Frame.new(
              reference: target_frame, frame_id: '',
              location: Applitools::Location.for(frame_location_size.location),
              size: Applitools::RectangleSize.for(frame_location_size.size),
              parent_scroll_position: Applitools::Selenium::ScrollPositionProvider.new(parent).current_position
            )
          )
        else
          raise Applitools::EyesError.new('will_switch_to_frame(): target type is not recognized!')
        end
        logger.info 'Done!'
      end

      # def will_switch_to_window(name_or_handle)
      #
      # end

      private

      attr_accessor :parent
    end

    class << self
      def normalize_image(driver, image, rotation)
        normalize_rotation(driver, image, rotation)
        normalize_width(driver, image)
      end

      # Rotates the image as necessary. The rotation is either manually forced by passing a value in
      # the +rotation+ parameter, or automatically inferred if the +rotation+ parameter is +nil+.
      #
      # +driver+:: +Applitools::Selenium::Driver+ The driver which produced the screenshot.
      # +image+:: +ChunkyPNG::Canvas+ The image to normalize.
      # +rotation+:: +Integer+|+nil+ The degrees by which to rotate the image: positive values = clockwise rotation,
      #   negative values = counter-clockwise, 0 = force no rotation, +nil+ = rotate automatically when needed.
      def normalize_rotation(driver, image, rotation)
        return if rotation && rotation.zero?

        num_quadrants = 0
        if !rotation.nil?
          if (rotation % RIGHT_ANGLE).nonzero?
            raise Applitools::EyesError.new('Currently only quadrant rotations are supported. Current rotation: '\
            "#{rotation}")
          end
          num_quadrants = (rotation / RIGHT_ANGLE).to_i
        elsif rotation.nil? && driver.mobile_device? && driver.landscape_orientation? && image.height > image.width
          # For Android, we need to rotate images to the right, and for iOS to the left.
          num_quadrants = driver.android? ? 1 : -1
        end

        Applitools::Utils::ImageUtils.quadrant_rotate!(image, num_quadrants)
      end

      def normalize_width(driver, image)
        return if driver.mobile_device?

        normalization_factor = driver.browser.image_normalization_factor(image)
        Applitools::Utils::ImageUtils.scale!(image, normalization_factor) unless normalization_factor == 1
      end
    end
  end
end
