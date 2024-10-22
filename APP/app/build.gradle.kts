plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

android {
    namespace = "sg.edu.np.mad.atm"
    compileSdk = 34

    defaultConfig {
        applicationId = "sg.edu.np.mad.atm"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}

dependencies {

    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)
    implementation(libs.biometric)
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation("com.google.firebase:firebase-messaging:23.1.0")
    implementation("androidx.biometric:biometric:1.1.0")
    implementation("androidx.core:core:1.6.0")
    implementation("androidx.core:core-ktx:1.6.0")
}